import websiteInfo from './../../utils/websiteInfo';

function Footer() {
  // Update the site author to match the new branding
  const siteAuthor = "Aether Ticket Team";
  
  return (
    <footer className="bg-surface border-t border-border-primary font-sans">
      <div className="max-w-5xl mx-auto px-4">
        <div className="py-8 flex flex-col md:flex-row justify-between items-center">
          <div className="text-text-secondary text-sm">
            © {new Date().getFullYear()} {siteAuthor}. All rights reserved.
          </div>
          <div className="mt-4 md:mt-0">
            <a
              href={websiteInfo.site.links.github}
              className="text-text-accent text-sm transition-all duration-fast hover:opacity-75"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;