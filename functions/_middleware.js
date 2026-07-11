// Edge middleware: 301 redirect apex microsave.fr -> www.microsave.fr
// (Handled here because the API token has no zone Rules permission.)
export const onRequest = async (context) => {
  const url = new URL(context.request.url);
  if (url.hostname === 'microsave.fr') {
    url.hostname = 'www.microsave.fr';
    return new Response(null, {
      status: 301,
      headers: { Location: url.toString(), 'Cache-Control': 'public, max-age=3600' },
    });
  }
  return context.next();
};
