import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./prisma";
import { ensureDefaultTeam } from "@/lib/auth-utils";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
        GitHubProvider({
            clientId: process.env.GITHUB_CLIENT_ID || "",
            clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
            authorization: {
                params: {
                    scope: "read:user user:email repo",
                },
            },
        }),
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Invalid credentials");
                }

                const user = await prisma.user.findUnique({
                    where: {
                        email: credentials.email,
                    },
                });

                if (!user || !user.password) {
                    throw new Error("Invalid credentials");
                }

                const isPasswordValid = await bcrypt.compare(
                    credentials.password,
                    user.password
                );

                if (!isPasswordValid) {
                    throw new Error("Invalid credentials");
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    image: user.image,
                };
            },
        }),
    ],
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    pages: {
        signIn: "/login",
        error: "/login",
    },
    callbacks: {
        async jwt({ token, user, account }) {
            if (user) {
                token.id = user.id;
                try {
                    // Ensure the user has a default personal team on sign-in
                    await ensureDefaultTeam(user.id as string);
                } catch (err) {
                    console.error("Failed ensuring default team during jwt callback:", err);
                }
            }
            // Store GitHub access token in JWT during initial sign-in
            if (account?.provider === "github" && account?.access_token) {
                token.githubAccessToken = account.access_token;
            }
            // If token doesn't have githubAccessToken, try to fetch it from database
            if (!token.githubAccessToken && token.id) {
                try {
                    const githubAccount = await prisma.account.findFirst({
                        where: {
                            userId: token.id as string,
                            provider: "github",
                        },
                        select: {
                            access_token: true,
                        },
                    });

                    if (githubAccount?.access_token) {
                        token.githubAccessToken = githubAccount.access_token;
                    }
                } catch (error) {
                    console.error("Error fetching GitHub access token:", error);
                }
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
            }
            // Pass GitHub access token to session if available
            if (token.githubAccessToken) {
                session.githubAccessToken = token.githubAccessToken as string;
            }
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
    debug: process.env.NODE_ENV === "development",
};
