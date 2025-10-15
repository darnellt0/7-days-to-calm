/**
 * Placeholder ElevenLabs/Convai client.
 * Replace with real SDKs as you integrate.
 */

export type SpeakOptions = { voice?: string; pace?: 'normal'|'slow'|'slower' };

export async function speak(text: string, opts?: SpeakOptions) {
  // TODO: Wire real TTS. For now, just log.
  console.log('[TTS]', opts?.voice ?? 'default', text.slice(0, 120).replace(/\n/g, ' ') + (text.length > 120 ? '…' : ''));
}
