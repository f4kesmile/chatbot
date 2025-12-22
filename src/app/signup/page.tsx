import { SignupForm } from "@/components/signup-form";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4 bg-white dark:bg-black transition-colors duration-300">
      <div className="w-full max-w-md">
        <SignupForm />
      </div>
    </div>
  );
}
