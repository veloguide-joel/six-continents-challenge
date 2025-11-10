// validate-answer edge function
// Validates riddle answers for the contest app

import { createClient } from 'npm:@supabase/supabase-js@2';

function corsHeaders() {
  return new Response(JSON.stringify({}), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS'
    }
  });
}

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  const log = (...args) => console.log(`[${requestId}]`, ...args);
  const err = (...args) => console.error(`[${requestId}]`, ...args);

  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    });
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({
      ok: false,
      error: 'Method not allowed'
    }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  try {
    // Parse JSON body
    let body;
    try {
      body = await req.json();
    } catch (e) {
      log('Invalid JSON:', e);
      return new Response(JSON.stringify({
        ok: false,
        error: 'Invalid JSON'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    let { stage, step, answer } = body;
    log('Incoming payload:', {
      stage,
      step,
      answer
    });

    if (stage === undefined || answer === undefined) {
      err('Missing required fields:', {
        stage,
        answer
      });
      return new Response(JSON.stringify({
        ok: false,
        error: 'Missing required fields: stage, answer'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Normalize inputs
    const nStage = parseInt(stage);
    const nStep = step === undefined ? 1 : parseInt(step);
    const normalizedAnswer = String(answer).toLowerCase().trim();

    // Answer key
    const answers = {
      '1': 'bucharest',
      '2': 'mihaieminescu',
      '3': 'thehobbit',
      '4': 'gertrudebell',
      '5a': 'thebookofthedead',
      '5b': '436',
      '6a': 'therivernile',
      '6b': 'trabzon',
      '7a': 'bondibay',
      '7b': 'comrad7632',
      '8a': 'captaincook',
      '8b': '$60',
      '9a': 'magnificent',
      '9b': 'tbd',
      '10a': 'gobeklitepe',
      '10b': 'tbd',
      '11a': 'liberty',
      '11b': 'tbd',
      '12a': 'roosevelt',
      '12b': 'tbd',
      '13a': 'cartagena',
      '13b': 'tbd',
      '14a': 'onehundred',
      '14b': 'tbd',
      '15a': 'templomayor',
      '15b': 'tbd',
      '16': 'thefinaldestination'
      '16b': 'tbd',
    };

    // Build key (stages 5-15 have two parts)
    let key = String(nStage);
    if (nStage >= 5 && nStage <= 15) {
      if (nStep !== 1 && nStep !== 2) {
        err('Invalid step for two-part stage:', {
          stage: nStage,
          step: nStep
        });
        return new Response(JSON.stringify({
          ok: false,
          error: 'Invalid step for two-part stage'
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      key = `${nStage}${nStep === 1 ? 'a' : 'b'}`;
    }

    const correctAnswer = answers[key];
    log('Validation check:', {
      key,
      correctAnswer,
      normalizedAnswer,
      match: correctAnswer === normalizedAnswer
    });

    if (!correctAnswer) {
      err('No answer found for key:', key);
      return new Response(JSON.stringify({
        ok: false,
        error: 'Invalid stage/step combination'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    const isCorrect = correctAnswer === normalizedAnswer;
    log('Answer validation result:', {
      stage: nStage,
      step: nStep,
      correct: isCorrect
    });

    return new Response(JSON.stringify({
      ok: isCorrect
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    err('Validation error:', error);
    return new Response(JSON.stringify({
      ok: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
});
