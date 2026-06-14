/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface FeedbackPayload {
  reaction: 'up' | 'down';
  text?: string;
  locationContext: string;
}

/**
 * Serverless feedback submission engine.
 * Delivers user feedback payloads directly to Formspree, Web3Forms, or other endpoints
 * relying on process environment variable VITE_FEEDBACK_ENDPOINT.
 */
export async function submitFeedback(payload: FeedbackPayload): Promise<{ success: boolean; message: string }> {
  const endpoint = (import.meta as any).env?.VITE_FEEDBACK_ENDPOINT;

  if (!endpoint) {
    // A graceful offline fallback that simulates network delay for smooth testing
    console.warn(
      'VITE_FEEDBACK_ENDPOINT is currently empty in .env. Falling back to local offline simulation.'
    );
    await new Promise(resolve => setTimeout(resolve, 800));
    return {
      success: true,
      message: 'Form endpoint unconfigured, local simulation succeeded.'
    };
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        subject: 'Just Weather - User Feedback Log',
        reaction: payload.reaction === 'up' ? '👍 Thumbs Up' : '👎 Thumbs Down',
        feedback_text: payload.text || '(Vacant thoughts)',
        location: payload.locationContext,
        timestamp: new Date().toISOString()
      })
    });

    if (response.ok) {
      return {
        success: true,
        message: 'Your feedback was dispatched successfully!'
      };
    } else {
      const errorBody = await response.json().catch(() => ({}));
      return {
        success: false,
        message: errorBody.message || errorBody.error || `Request failed with code ${response.status}.`
      };
    }
  } catch (error: any) {
    console.error('Feedback service transmission failure', error);
    return {
      success: false,
      message: error?.message || 'Network lookup error. Please verify connections.'
    };
  }
}
