const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card border-t border-border mt-auto py-4">
      <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
        <p>
          &copy; {currentYear}{" "}
          <a
            href="https://www.surakshanet.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Suraksha Diagnostics Limited
          </a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
