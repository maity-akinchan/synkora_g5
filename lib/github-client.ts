import { Octokit } from "@octokit/rest";

export interface GitHubCommit {
    sha: string;
    message: string;
    author: string;
    authorEmail: string;
    committedAt: Date;
    url: string;
}

export interface GitHubBranch {
    name: string;
    sha: string;
    protected: boolean;
}

export interface GitHubPullRequest {
    number: number;
    title: string;
    state: string;
    author: string;
    createdAt: Date;
    updatedAt: Date;
    url: string;
    merged: boolean;
}

export class GitHubClient {
    private octokit: Octokit;

    constructor(accessToken: string) {
        this.octokit = new Octokit({
            auth: accessToken,
        });
    }

    async getCommits(
        owner: string,
        repo: string,
        options?: {
            page?: number;
            perPage?: number;
            since?: Date;
            until?: Date;
            sha?: string;
        }
    ): Promise<{ commits: GitHubCommit[]; hasMore: boolean }> {
        try {
            const response = await this.octokit.repos.listCommits({
                owner,
                repo,
                page: options?.page || 1,
                per_page: options?.perPage || 30,
                since: options?.since?.toISOString(),
                until: options?.until?.toISOString(),
                sha: options?.sha,
            });

            const commits: GitHubCommit[] = response.data.map((commit) => ({
                sha: commit.sha,
                message: commit.commit.message,
                author: commit.commit.author?.name || "Unknown",
                authorEmail: commit.commit.author?.email || "",
                committedAt: new Date(commit.commit.author?.date || Date.now()),
                url: commit.html_url,
            }));

            // Check if there are more pages
            const hasMore = response.data.length === (options?.perPage || 30);

            return { commits, hasMore };
        } catch (error) {
            console.error("Error fetching commits:", error);
            // Rethrow original error so callers can inspect status/response
            throw error;
        }
    }

    async getBranches(
        owner: string,
        repo: string,
        options?: {
            page?: number;
            perPage?: number;
        }
    ): Promise<{ branches: GitHubBranch[]; hasMore: boolean }> {
        try {
            const response = await this.octokit.repos.listBranches({
                owner,
                repo,
                page: options?.page || 1,
                per_page: options?.perPage || 30,
            });

            const branches: GitHubBranch[] = response.data.map((branch) => ({
                name: branch.name,
                sha: branch.commit.sha,
                protected: branch.protected,
            }));

            const hasMore = response.data.length === (options?.perPage || 30);

            return { branches, hasMore };
        } catch (error) {
            console.error("Error fetching branches:", error);
            throw error;
        }
    }

    async getPullRequests(
        owner: string,
        repo: string,
        options?: {
            page?: number;
            perPage?: number;
            state?: "open" | "closed" | "all";
        }
    ): Promise<{ pullRequests: GitHubPullRequest[]; hasMore: boolean }> {
        try {
            const response = await this.octokit.pulls.list({
                owner,
                repo,
                state: options?.state || "all",
                page: options?.page || 1,
                per_page: options?.perPage || 30,
                sort: "updated",
                direction: "desc",
            });

            const pullRequests: GitHubPullRequest[] = response.data.map((pr) => ({
                number: pr.number,
                title: pr.title,
                state: pr.state,
                author: pr.user?.login || "Unknown",
                createdAt: new Date(pr.created_at),
                updatedAt: new Date(pr.updated_at),
                url: pr.html_url,
                merged: pr.merged_at !== null,
            }));

            const hasMore = response.data.length === (options?.perPage || 30);

            return { pullRequests, hasMore };
        } catch (error) {
            console.error("Error fetching pull requests:", error);
            throw error;
        }
    }

    async getRepository(owner: string, repo: string) {
        try {
            const response = await this.octokit.repos.get({
                owner,
                repo,
            });

            return {
                id: response.data.id.toString(),
                name: response.data.name,
                fullName: response.data.full_name,
                description: response.data.description,
                private: response.data.private,
                url: response.data.html_url,
            };
        } catch (error) {
            console.error("Error fetching repository:", error);
            throw error;
        }
    }

    async listUserRepositories(options?: {
        page?: number;
        perPage?: number;
        sort?: "created" | "updated" | "pushed" | "full_name";
    }) {
        try {
            const response = await this.octokit.repos.listForAuthenticatedUser({
                page: options?.page || 1,
                per_page: options?.perPage || 30,
                sort: options?.sort || "updated",
                direction: "desc",
            });

            const repositories = response.data.map((repo) => ({
                id: repo.id.toString(),
                name: repo.name,
                fullName: repo.full_name,
                owner: repo.owner.login,
                description: repo.description,
                private: repo.private,
                url: repo.html_url,
            }));

            const hasMore = response.data.length === (options?.perPage || 30);

            return { repositories, hasMore };
        } catch (error) {
            console.error("Error fetching user repositories:", error);
            throw error;
        }
    }
}
