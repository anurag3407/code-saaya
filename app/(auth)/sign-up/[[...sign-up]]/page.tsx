import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-[-20%] right-[-10%] h-[500px] w-[500px] rounded-full bg-fuji-500/[0.04] blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] h-[400px] w-[400px] rounded-full bg-tsuki-500/[0.03] blur-[100px]" />
      </div>
      <div className="relative z-10">
        <SignUp
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-ink-900 border border-ink-700 shadow-elevated",
            },
          }}
        />
      </div>
    </div>
  );
}
