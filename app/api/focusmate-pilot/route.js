import { NextResponse } from 'next/server';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const PILOTS_FILE = path.join(DATA_DIR, 'focusmate-pilots.json');

// Ensure data directory exists
async function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true });
  }
}

// Read existing pilots
async function readPilots() {
  try {
    const data = await readFile(PILOTS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // File doesn't exist yet, return empty array
    return [];
  }
}

// Write pilots to file
async function writePilots(pilots) {
  await ensureDataDir();
  await writeFile(PILOTS_FILE, JSON.stringify(pilots, null, 2));
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, name } = body;

    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    // Read existing pilots
    const pilots = await readPilots();

    // Check if email already exists
    const existingPilot = pilots.find(p => p.email.toLowerCase() === email.toLowerCase());
    if (existingPilot) {
      return NextResponse.json(
        { error: 'This email is already registered for the pilot' },
        { status: 409 }
      );
    }

    // Create new pilot entry
    const newPilot = {
      id: Date.now().toString(),
      email: email.trim(),
      name: name?.trim() || '',
      createdAt: new Date().toISOString(),
      source: 'website',
    };

    // Add to array and save
    pilots.push(newPilot);
    await writePilots(pilots);

    // Log for monitoring
    console.log('[FocusMate Pilot] New signup:', {
      email: newPilot.email,
      name: newPilot.name,
      timestamp: newPilot.createdAt,
    });

    return NextResponse.json(
      {
        success: true,
        message: "You're on the list! Check your email for confirmation.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[FocusMate Pilot] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}

// Optional: GET endpoint to retrieve pilot count (for admin purposes)
export async function GET() {
  try {
    const pilots = await readPilots();
    return NextResponse.json({
      count: pilots.length,
      message: 'FocusMate pilot API is running',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Unable to retrieve pilot data' },
      { status: 500 }
    );
  }
}
