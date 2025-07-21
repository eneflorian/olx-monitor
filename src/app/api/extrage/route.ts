import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { categorie, subcategorie, oras } = body;

    // Validare parametri
    if (!categorie || !subcategorie || !oras) {
      return NextResponse.json(
        { error: 'Parametri lipsă: categorie, subcategorie, oras' },
        { status: 400 }
      );
    }

    // Construiește comanda pentru scriptul de extragere
    const command = `node olx-scraper-intelligent.js --categorie=${categorie} --subcategorie=${subcategorie} --oras=${oras}`;

    console.log(`Pornesc extragerea pentru: ${categorie} - ${subcategorie} - ${oras}`);

    // Rulează scriptul în background
    execAsync(command, { cwd: process.cwd() })
      .then(({ stdout, stderr }) => {
        console.log('Extragere completă:', stdout);
        if (stderr) console.error('Erori extragere:', stderr);
      })
      .catch((error) => {
        console.error('Eroare la extragere:', error);
      });

    return NextResponse.json({
      success: true,
      message: `Extragerea a pornit pentru ${categorie} - ${subcategorie} - ${oras}`,
      params: { categorie, subcategorie, oras }
    });

  } catch (error) {
    console.error('Eroare la procesarea cererii:', error);
    return NextResponse.json(
      { error: 'Eroare internă server' },
      { status: 500 }
    );
  }
} 