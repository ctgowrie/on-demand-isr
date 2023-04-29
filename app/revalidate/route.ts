import { NextRequest, unstable_revalidatePath } from "next/server";
import { createHmac } from 'crypto';

export const revalidate = 0;

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
  const signature = req.headers['x-hub-signature-256'];
  const computedSignature =
    'sha256=' + createHmac('sha256', secret).update(body).digest('hex');

  if (computedSignature === signature) {
    console.log(
      'event',
      req.headers['x-github-event'],
      'action',
      jsonBody.action,
      'issue',
      jsonBody.issue?.title,
      jsonBody.issue?.number
    );

    const issueNumber = jsonBody.issue?.number;

    // issue opened or edited
    // comment created or edited
    console.log('[Next.js] Revalidating /');
    unstable_revalidatePath('/');
    if (issueNumber) {
      console.log(`[Next.js] Revalidating /${issueNumber}`);
      unstable_revalidatePath(`/${issueNumber}`);
    }

    return new Response('OK');
  } else {
    console.log('Invalid signature ', computedSignature, ' ', body)
    return new Response('Forbidden', { status: 403 });
  }
}
