"use client";

import React, { useEffect, useRef, useState } from "react";
import { Camera, Upload, Edit2 } from "lucide-react";

export default function SettingsPage(): React.ReactElement {
  const [fullName, setFullName] = useState<string>("Azusa Nakano");
  const [email, setEmail] = useState<string>("elementary221b@gmail.com");
  const [phone, setPhone] = useState<string>("+44 (123) 456-9878");
  const [accountType, setAccountType] = useState<string>("Regular");
  const [bio, setBio] = useState<string>("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // create object URL for preview and clean up previous URL
  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview((prev) => {
        if (prev && prev.startsWith("blob:")) {
          URL.revokeObjectURL(prev);
        }
        return null;
      });
      return;
    }

    const url = URL.createObjectURL(avatarFile);
    // revoke previous if existed
    setAvatarPreview((prev) => {
      if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
      return url;
    });

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [avatarFile]);

  function handleFile(file: File | undefined) {
    if (!file) return;
    // optional: validate size/type here
    setAvatarFile(file);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    // Example: create FormData if uploading
    // const fd = new FormData();
    // fd.append('fullName', fullName);
    // fd.append('avatar', avatarFile as Blob);
    // await fetch('/api/profile', { method:'POST', body: fd });
    alert("Settings saved (mock)");
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header area */}
        <div className="flex items-center gap-6 mb-8">
          <div className="relative">
            <div className="h-20 w-20 md:h-24 md:w-24 rounded-full overflow-hidden border-2 border-slate-700 shadow-md">
              {avatarPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarPreview} alt="avatar" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center">
                  <span className="text-xl font-semibold">AZ</span>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={openFilePicker}
              className="absolute -bottom-1 -right-1 bg-violet-600 hover:bg-violet-500 p-2 rounded-full shadow-lg border border-slate-800"
              title="Change avatar"
            >
              <Camera className="h-4 w-4" />
            </button>
          </div>

          <div>
            <h1 className="text-2xl font-semibold">
              Azunyan U. Wu{" "}
              <span className="ml-2 px-2 py-1 text-xs rounded-full bg-slate-800/60">Pro</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">{email}</p>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <button className="px-4 py-2 bg-slate-800/40 text-sm rounded-md hover:bg-slate-800">Share</button>
            <button className="px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-md">View Profile</button>
          </div>
        </div>

        {/* Main card */}
        <form onSubmit={saveSettings} className="bg-gradient-to-b from-slate-800/60 to-slate-800/40 border border-slate-700 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Left column */}
              <div className="md:w-1/3 space-y-4">
                <h3 className="text-lg font-semibold">Personal Info</h3>
                <p className="text-sm text-slate-400">You can change your personal information settings here.</p>

                <div className="mt-6 space-y-4">
                  <div>
                    <label className="text-xs text-slate-400">Full Name</label>
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-slate-900/40 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400">Email Address</label>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full mt-1 bg-slate-900/40 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder:text-slate-400"
                      type="email"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400">Phone Number</label>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full mt-1 bg-slate-900/40 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder:text-slate-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400">Account Type</label>
                    <select
                      value={accountType}
                      onChange={(e) => setAccountType(e.target.value)}
                      className="w-full mt-1 bg-slate-900/40 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                    >
                      <option>Regular</option>
                      <option>Admin</option>
                      <option>Owner</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Right column */}
              <div className="md:w-2/3">
                <div className="bg-slate-900/30 border border-slate-700 rounded-xl p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Change Avatar</h3>
                    <p className="text-sm text-slate-400">Supported Format: SVG, JPG, PNG (10mb each)</p>
                  </div>

                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={onDrop}
                    className={`relative border-2 border-dashed rounded-xl p-6 flex items-center justify-center min-h-[160px] ${
                      dragOver ? "border-violet-500 bg-slate-800/30" : "border-slate-700 bg-slate-900/20"
                    }`}
                  >
                    <div className="text-center">
                      <div className="mx-auto mb-3 w-12 h-12 rounded-lg flex items-center justify-center bg-slate-800/40">
                        <Upload className="h-6 w-6" />
                      </div>
                      <p className="text-sm text-slate-200">Click here to upload your file or drag.</p>
                      <p className="text-xs text-slate-400 mt-1">Supported Format: SVG, JPG, PNG (10mb each)</p>
                      <div className="mt-4 flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={openFilePicker}
                          className="px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-md flex items-center gap-2"
                        >
                          <span>Upload</span>
                          <Edit2 className="h-4 w-4" />
                        </button>
                        {avatarPreview && (
                          <button
                            type="button"
                            onClick={() => {
                              // cleanup
                              if (avatarPreview && avatarPreview.startsWith("blob:")) URL.revokeObjectURL(avatarPreview);
                              setAvatarFile(null);
                              setAvatarPreview(null);
                            }}
                            className="px-4 py-2 bg-slate-700/60 hover:bg-slate-700 rounded-md"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
                    </div>

                    {avatarPreview && (
                      <div className="absolute -top-6 right-6 w-24 h-24 rounded-full overflow-hidden border-2 border-slate-700 shadow-lg">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={avatarPreview} alt="preview" className="h-full w-full object-cover" />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-xs text-slate-400">Bio</label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="w-full mt-2 min-h-[90px] bg-slate-900/40 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder:text-slate-400"
                      placeholder="Write something about yourself..."
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        // reset demo
                        if (avatarPreview && avatarPreview.startsWith("blob:")) URL.revokeObjectURL(avatarPreview);
                        setFullName("Azusa Nakano");
                        setEmail("elementary221b@gmail.com");
                        setPhone("+44 (123) 456-9878");
                        setAccountType("Regular");
                        setBio("");
                        setAvatarFile(null);
                        setAvatarPreview(null);
                      }}
                      className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-md"
                    >
                      Cancel
                    </button>

                    <button type="submit" className="px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-md">
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>

        <footer className="mt-6 text-center text-xs text-slate-500">Synkora 2025</footer>
      </div>
    </div>
  );
}
