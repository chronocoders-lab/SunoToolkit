// scripts/custom-batch.js
const SunoManager = require('./src/core/SunoManager')

async function customBatch () {
  const suno = new SunoManager()
  await suno.initialize()

  const prompts = [
    { prompt: 'happy birthday song', tags: 'pop' },
    {
      prompt: 'lullaby for babies',
      tags: 'classical',
      make_instrumental: true
    }
  ]

  for (const prompt of prompts) {
    await suno.generateSong(prompt)
    await new Promise((resolve) => setTimeout(resolve, 5000))
  }
}

customBatch()
