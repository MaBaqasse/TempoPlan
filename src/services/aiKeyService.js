// P1 : test d’une clé API Gemini depuis le navigateur (bouton « Tester la clé » des paramètres).
// Appelle seulement la liste des modèles : aucune génération, donc presque aucun quota consommé.
export async function testGeminiKey(apiKey) {
  const key = String(apiKey ?? '').trim()
  if (!key) return { ok: false, message: 'Saisissez d’abord une clé.' }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=1', {
      headers: { 'x-goog-api-key': key },
      signal: controller.signal,
    })
    if (response.ok) return { ok: true, message: 'Clé valide : l’assistant pourra utiliser l’IA.' }
    if (response.status === 429) return { ok: true, message: 'Clé reconnue, mais le quota gratuit est atteint pour le moment.' }
    if ([400, 401, 403].includes(response.status)) {
      return { ok: false, message: 'Clé refusée par le service. Vérifiez qu’elle est complète et active.' }
    }
    return { ok: false, message: 'Le service est indisponible pour le moment. Réessayez plus tard.' }
  } catch (error) {
    return {
      ok: false,
      message:
        error?.name === 'AbortError'
          ? 'Le service met trop de temps à répondre.'
          : 'Impossible de joindre le service. Vérifiez votre connexion.',
    }
  } finally {
    clearTimeout(timer)
  }
}
