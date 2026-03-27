export function registerTemplates(Handlebars) {
  // Templates are loaded directly in generators
  // This file can be extended for template helpers
  Handlebars.registerHelper('toDisplayName', function(name) {
    return name
      .split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
  });

  Handlebars.registerHelper('slugify', function(text) {
    return text.toLowerCase().replace(/\s+/g, '-');
  });
}
