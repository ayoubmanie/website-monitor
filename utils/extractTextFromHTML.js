// Basic HTML to text converter (handles simple cases)
function extractTextFromHTML(html) {
  // Remove script and style tags
  let text = html.replace(/<script[^>]*>([\s\S]*?)<\/script>/gmi, '');
  text = text.replace(/<style[^>]*>([\s\S]*?)<\/style>/gmi, '');
  // Replace HTML entities
  text = text.replace(/&(nbsp|amp|quot|lt|gt);/g, ' ');
  // Remove HTML tags but keep text content
  text = text.replace(/<[^>]+>/g, ' ');
  // Collapse multiple whitespace
  text = text.replace(/\s+/g, ' ').trim();
  return text;
}
module.exports = { extractTextFromHTML }
