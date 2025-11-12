// Structured data for SEO - moved from inline scripts for better CSP compliance
window.addStructuredData = function(data) {
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
};