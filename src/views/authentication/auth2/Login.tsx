import CardBox from "src/components/shared/CardBox";

import AuthLogin from "../authforms/AuthLogin";

import FullLogo from "src/layouts/full/shared/logo/FullLogo";


const Login = () => {
  return (
    <>
      <div className="relative overflow-hidden h-screen bg-lightprimary dark:bg-darkprimary">
        {/* Animated Bubbles Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Bubble 1 */}
          <div className="absolute w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-float-slow"
            style={{ top: '10%', left: '10%', animationDelay: '0s' }}></div>

          {/* Bubble 2 */}
          <div className="absolute w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-float-medium"
            style={{ top: '60%', right: '15%', animationDelay: '2s' }}></div>

          {/* Bubble 3 */}
          <div className="absolute w-80 h-80 bg-primary/15 rounded-full blur-3xl animate-float-fast"
            style={{ bottom: '10%', left: '15%', animationDelay: '4s' }}></div>

          {/* Bubble 4 */}
          <div className="absolute w-72 h-72 bg-secondary/15 rounded-full blur-3xl animate-float-slow"
            style={{ top: '30%', right: '25%', animationDelay: '1s' }}></div>

          {/* Bubble 5 */}
          <div className="absolute w-56 h-56 bg-primary/20 rounded-full blur-2xl animate-float-medium"
            style={{ bottom: '30%', right: '10%', animationDelay: '3s' }}></div>
        </div>

        {/* Login Card - Above bubbles */}
        <div className="relative flex h-full justify-center items-center px-4 z-10">
          <CardBox className="md:w-[450px] w-full border-none backdrop-blur-sm bg-white/95 dark:bg-dark/95">
            <div className="mx-auto mb-6">
              <FullLogo />
            </div>
            <AuthLogin />
          </CardBox>
        </div>
      </div>

      {/* Bubble Animation Styles */}
      <style>{`
        @keyframes float-slow {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -30px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }

        @keyframes float-medium {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(-40px, -40px) scale(1.15);
          }
        }

        @keyframes float-fast {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(20px, -25px) scale(1.05);
          }
          50% {
            transform: translate(-30px, -15px) scale(0.95);
          }
          75% {
            transform: translate(10px, 30px) scale(1.1);
          }
        }

        .animate-float-slow {
          animation: float-slow 20s ease-in-out infinite;
        }

        .animate-float-medium {
          animation: float-medium 15s ease-in-out infinite;
        }

        .animate-float-fast {
          animation: float-fast 12s ease-in-out infinite;
        }
      `}</style>
    </>
  );
};

export default Login;
