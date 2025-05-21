import { Link } from "wouter";
import companyLogo from "@assets/AliudLogo_Purple.png";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white border-t border-gray-200 py-6 mt-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <Link href="/">
              <img 
                src={companyLogo} 
                alt="Aliud Alternative" 
                className="h-10 cursor-pointer"
              />
            </Link>
          </div>
          
          <div className="text-center md:text-right text-sm text-gray-500">
            <p>© {currentYear} Aliud Alternative. All rights reserved.</p>
            <p className="mt-1">Empowering students through personalized learning.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;