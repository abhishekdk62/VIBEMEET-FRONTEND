import React from 'react';
import TiltedCard from './TiltedCard';
import { ExternalLink, Github, Linkedin } from 'lucide-react';

const About = () => {
  return (
    <div className="min-h-screen bg-amber-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Heading */}
        <h1 className="text-5xl font-bold text-center text-gray-900 mb-12">
          About Us
        </h1>

        {/* About the App */}
        <div className="space-y-6">
          <p className="text-md text-gray-800 leading-relaxed">
            Welcome to our cutting-edge video calling application, built with modern web technologies to deliver seamless real-time communication. This platform leverages a powerful technology stack including <span className="font-semibold">Node.js with Express.js</span> for the backend API, <span className="font-semibold">React.js</span> for the dynamic frontend interface, and <span className="font-semibold">Tailwind CSS</span> for sleek, responsive styling. We've integrated premium third-party libraries like <span className="font-semibold">React Bits</span> for enhanced UI components, ensuring a polished user experience across all devices.
          </p>

          <p className="text-md text-gray-800 leading-relaxed">
            Security and authentication are paramount in our application. We've implemented <span className="font-semibold">Google OAuth 2.0</span> authentication to provide secure, hassle-free login for users. The real-time communication features are powered by <span className="font-semibold">Socket.IO</span> for instant messaging and signaling, combined with <span className="font-semibold">WebRTC</span> technology for peer-to-peer video and audio streaming. Our platform supports advanced features including high-quality video calls, crystal-clear audio communication, screen sharing capabilities, and comprehensive user controls.
          </p>

          <p className="text-md text-gray-800 leading-relaxed">
            The application offers robust meeting management features that empower both hosts and participants. Users can easily mute and unmute their own microphone and video, while hosts have additional privileges to control participants' audio and video streams when necessary. The platform includes a comprehensive call history page that tracks all past meetings, making it easy to reference previous sessions and maintain organized records. Whether you're conducting business meetings, virtual classrooms, or casual video chats with friends, our application provides the reliability and feature set you need.
          </p>

          {/* About the Developer */}
          <div className="mt-12 pt-8 border-t-2 border-gray-300">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">About the Developer</h2>
            
            <p className="text-md text-gray-800 leading-relaxed mb-6">
              Hi! I'm <span className="font-semibold">Abhishek D K</span>, an <span className="font-semibold">MCA graduate</span> and passionate Frontend Developer with hands-on experience building responsive, high-performance web applications using the modern React ecosystem. I specialize in <span className="font-semibold">React.js, Next.js, and TypeScript</span> with expertise in component architecture, state management, and pixel-perfect UI implementation. I'm proficient in CSS frameworks like <span className="font-semibold">Tailwind CSS and Bootstrap</span>, third-party library integration, and creating seamless user experiences with real-time features. My experience extends to performance optimization, responsive design principles, modern development workflows, and collaborative frontend development using Git and Agile methodologies.
            </p>

            {/* Card on left with text wrapping on right */}
            <div className="mb-6">
              {/* Float card to left */}
              <div className="float-left mr-6 mb-4">
                <TiltedCard
                  imageSrc="img1.jpeg"
                  altText="Abhishek DK"
                  captionText="MERN Stack Developer"
                  containerHeight="300px"
                  containerWidth="300px"
                  imageHeight="300px"
                  imageWidth="300px"
                  rotateAmplitude={12}
                  scaleOnHover={1.2}
                  showMobileWarning={false}
                  showTooltip={true}
                  displayOverlayContent={true}
                  overlayContent={
                    <p className="tilted-card-demo-text">
                      Abhishek DK (MERN Stack Dev)
                    </p>
                  }
                />
              </div>

              {/* Text wraps around the card */}
              <p className="text-md text-gray-800 leading-relaxed mb-4">
                My technical expertise spans both frontend and backend technologies. On the frontend, I excel in <span className="font-semibold">React.js, Next.js, JavaScript ES6+, TypeScript, HTML5, CSS3</span>, with a strong focus on responsive design and component architecture. I specialize in modern styling frameworks including <span className="font-semibold">Tailwind CSS, Bootstrap, SCSS/SASS, CSS Modules, Styled Components, Material-UI (MUI)</span>, and <span className="font-semibold">Ant Design</span>. For state management, I work with <span className="font-semibold">React Context API, Zustand, Redux Toolkit</span>, and <span className="font-semibold">React Query/TanStack Query</span> to build maintainable and performant applications.
              </p>

              <p className="text-md text-gray-800 leading-relaxed mb-4">
                On the backend, I create robust server-side applications using <span className="font-semibold">Node.js, Express.js, and Go</span>, designing RESTful APIs and implementing microservices architecture for scalable solutions. My database proficiency covers <span className="font-semibold">MongoDB, MySQL, PostgreSQL, and Redis</span>, with strong skills in database design, optimization, and query performance tuning. I implement comprehensive authentication solutions using <span className="font-semibold">JWT, OAuth 2.0, Passport.js, and bcrypt</span>, with role-based access control and rigorous input validation to protect user data.
              </p>

              {/* Clear float to prevent layout issues */}
              <div className="clear-both"></div>
            </div>

            <p className="text-md text-gray-800 leading-relaxed mb-4">
              I specialize in real-time communication features using <span className="font-semibold">Socket.IO (client & server), WebRTC, WebSocket</span>, and Server-Sent Events for building interactive applications. I have hands-on experience integrating payment gateways including <span className="font-semibold">Stripe API, PayPal SDK, and Razorpay Gateway</span>, with expertise in webhook handling for secure transaction processing.
            </p>

            <p className="text-md text-gray-800 leading-relaxed mb-4">
              My development workflow utilizes modern tools like <span className="font-semibold">Vite, Webpack, ESLint, Prettier, Postman, and Swagger</span>, complemented by comprehensive testing using <span className="font-semibold">Jest, React Testing Library, Mocha, and Chai</span> for unit and integration testing. For deployment and DevOps, I work with <span className="font-semibold">Docker, AWS (EC2, S3), Nginx, Vercel, and Netlify</span>, implementing CI/CD pipelines using GitHub Actions.
            </p>

            <p className="text-md text-gray-800 leading-relaxed mb-6">
              I'm proficient with popular third-party libraries including <span className="font-semibold">Framer Motion</span> for animations, <span className="font-semibold">React Hook Form</span> for form management, <span className="font-semibold">Chart.js</span> for data visualization, and utilities like <span className="font-semibold">Axios, Lodash, and Multer</span> to accelerate development and enhance functionality.
            </p>

            {/* Social Links */}
            <div className="mt-8 pt-6 border-t border-gray-500">
              <h3 className="text-xl text-center font-semibold text-gray-900 mb-4">Connect With Me</h3>
              <div className="flex justify-center flex-wrap gap-4">
                <a
                  href="https://abhishekdk62.github.io/Portfolio/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  <ExternalLink size={18} />
                  Portfolio
                </a>
                <a
                  href="https://github.com/abhishekdk62"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors duration-200"
                >
                  <Github size={18} />
                  GitHub
                </a>
                <a
                  href="https://www.linkedin.com/in/abhishek-d-k-723137339/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors duration-200"
                >
                  <Linkedin size={18} />
                  LinkedIn
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
