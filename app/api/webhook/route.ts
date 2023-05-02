import { NextRequest } from "next/server";
import { unstable_revalidatePath, unstable_revalidateTag } from "next/cache";
import { createHmac } from 'crypto';

export async function POST(req: NextRequest) {
  // verify the webhook signature request against the
  // unmodified, unparsed body
  const body = await req.text();
  if (!body) {
    return new Response('No body', { status: 400 });
  }

  const jsonBody = JSON.parse(body);

  // compute our signature from the raw body
  const secret = process.env.GITHUB_WEBHOOK_SECRET || '';
  const signature = req.headers.get('x-hub-signature-256');
  const computedSignature =
    'sha256=' + createHmac('sha256', secret).update(body).digest('hex');

  if (computedSignature === signature) {
    console.log(
      'event',
      req.headers.get('x-github-event'),
      'action',
      jsonBody.action,
      'issue',
      jsonBody.issue?.title,
      jsonBody.issue?.number
    );

    const issueNumber = jsonBody.issue?.number;


    const url = new URL(req.url)
    const useTag = url.searchParams.get('useTag');
    if (true) {
      console.log('[Next.js] Revalidating github by tag');
      unstable_revalidateTag('github');
    } else {
      // issue opened or edited
      // comment created or edited
      console.log('[Next.js] Revalidating /');
      unstable_revalidatePath('/');
      if (issueNumber) {
        console.log(`[Next.js] Revalidating /${issueNumber}`);
        unstable_revalidatePath(`/${issueNumber}`);
      }
    }

    return new Response('OK');
  } else {
    const bodyLog = body.length > 36 ? body.substring(0, 36) + '...' : body;
    console.log('Invalid signature ', signature, '!=', computedSignature, ' ', bodyLog)
    return new Response('Forbidden', { status: 403 });
  }
}
