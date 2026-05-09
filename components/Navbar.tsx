"use client";

import Link from "next/link";
import { useState } from "react";

export default function Navbar({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full bg-white dark:bg-gray-900 shadow-md z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">HL</span>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white hidden sm:inline">
              Haryana Lottery
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
             <Link href="/games" className="text-gray-700 dark:text-gray-300 hover:text-purple-600 transition">
              Games
            </Link>
            <Link href="/results" className="text-gray-700 dark:text-gray-300 hover:text-purple-600 transition">
              Results
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-4">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="hidden sm:inline-block px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-lg hover:shadow-lg transition font-medium"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden sm:inline-block px-4 py-2 text-purple-600 border border-purple-600 rounded-lg hover:bg-purple-50 dark:hover:bg-gray-800 transition font-medium"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-lg hover:shadow-lg transition font-medium"
                >
                  Sign Up
                </Link>
              </>
            )}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => setIsOpen(!isOpen)}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4 border-t">
            <Link href="/games" className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-purple-600">
               Games
            </Link>
            <Link href="/results" className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-purple-600">
              Results
            </Link>
            
            {isLoggedIn ? (
              <Link href="/dashboard" className="block px-4 py-2 mt-2 text-white bg-purple-600 rounded-lg">
                Go to Dashboard
              </Link>
            ) : (
              <Link href="/login" className="block px-4 py-2 mt-2 text-purple-600 border border-purple-600 rounded-lg hover:bg-purple-50">
                Log In
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
