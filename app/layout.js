import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/context/AuthContext";
import { NotifiqProvider } from "@/providers/notificationProvider";
import ReactQueryProvider from "@/providers/react-query-provider";
import ThemeProvider from "@/providers/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Assignment Submission Platform",
  description: "A modern platform for managing assignments, submissions, and grading",
};

// Validate environment variables
const validateEnvVars = () => {
  const required = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
    'NEXT_PUBLIC_VAPID_KEY'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('Missing environment variables:', missing);
    return false;
  }

  // Check for quotes in values (common issue)
  const hasQuotes = required.some(key => {
    const value = process.env[key];
    return value && (value.startsWith('"') || value.startsWith("'"));
  });

  if (hasQuotes) {
    console.error('Environment variables contain quotes. Remove quotes from .env file');
    return false;
  }

  return true;
};


  const firebaseConfig =  {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  }
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_KEY


export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>
        <AuthProvider>
          <Toaster />
          <ReactQueryProvider>
            {firebaseConfig ? (
              <NotifiqProvider config={{ firebaseConfig, vapidKey,  enableAutoRefresh: true, autoGetToken : true, autoRequestPermission : true }}>
                {children}
              </NotifiqProvider>
            ) : (
              <div>
                <div style={{
                  background: 'red',
                  color: 'white',
                  padding: '10px',
                  margin: '10px'
                }}>
                  Firebase configuration error. Check console and environment variables.
                </div>
                {children}
              </div>
            )}
          </ReactQueryProvider>
        </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}