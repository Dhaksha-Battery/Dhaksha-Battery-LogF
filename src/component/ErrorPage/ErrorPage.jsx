// src/component/ErrorPage/ErrorPage.jsx
import { useRouteError, Link } from "react-router-dom";

const ErrorPage = () => {
  const data = useRouteError();
  console.log(data);

  return (
    <section className="bg-gray-50 min-h-screen flex items-center justify-center px-6">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8 text-center border-t-8 border-yellow-500">
        {/* Error Code */}
        <h1 className="text-8xl font-extrabold text-black mb-2">
          {data.status || "404"}
        </h1>

        {/* Error Text */}
        <h2 className="text-2xl font-semibold text-gray-800 mb-3">
          {data.statusText || "Page Not Found"}
        </h2>

        <p className="text-gray-500 text-sm mb-8">
          Sorry, we can’t find the page you’re looking for. <br />
          Please check the URL or go back to the homepage.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="px-6 py-2 rounded-md bg-black text-white text-sm font-medium hover:bg-gray-800 transition"
          >
             Back to Homepage
          </Link>

          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 rounded-md bg-yellow-500 text-black text-sm font-medium hover:bg-yellow-400 transition"
          >
             Retry
          </button>
        </div>

        {/* Optional Details -
        <div className="mt-6 text-xs text-gray-400">
          <p>
            If this issue persists, contact{" "}
            <a
              href="mailto:support@dhaksha.com"
              className="underline hover:text-yellow-500"
            >
              support@dhaksha.com
            </a>
          </p>
        </div> */} 
      </div>
    </section>
  );
};

export default ErrorPage;
