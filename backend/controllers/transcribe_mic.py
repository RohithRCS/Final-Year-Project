import speech_recognition as sr
from pydub import AudioSegment
import os
import sys
import tempfile

def transcribe_from_audio_file(file_path):
    print("Processing audio file", file=sys.stderr)
    r = sr.Recognizer()
    
    # Check if file is MP3 or M4A and convert to WAV
    file_ext = os.path.splitext(file_path.lower())[1]
    needs_conversion = file_ext in ['.mp3', '.m4a']
    
    if needs_conversion:
        try:
            print(f"Converting {file_ext} to WAV...", file=sys.stderr)
            
            # Load the audio file with pydub
            if file_ext == '.mp3':
                audio = AudioSegment.from_mp3(file_path)
            elif file_ext == '.m4a':
                audio = AudioSegment.from_file(file_path, format="m4a")
                
            # Export to temporary WAV file
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_wav:
                wav_path = temp_wav.name
                audio.export(wav_path, format="wav")
        except Exception as e:
            print(f"Error converting audio to WAV: {e}", file=sys.stderr)
            sys.exit(2)
    else:
        wav_path = file_path
    
    # Transcribe the WAV audio file
    try:
        with sr.AudioFile(wav_path) as source:
            audio_data = r.record(source)
    except Exception as e:
        print(f"Error reading audio file: {e}", file=sys.stderr)
        sys.exit(2)
    
    try:
        text = r.recognize_google(audio_data)
        print(text)
    except sr.UnknownValueError:
        print("Speech Recognition could not understand audio", file=sys.stderr)
        sys.exit(3)
    except sr.RequestError as e:
        print(f"Request error: {e}", file=sys.stderr)
        sys.exit(4)
    finally:
        # Clean up temp file if we created one
        if needs_conversion and os.path.exists(wav_path):
            os.remove(wav_path)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python transcribe_mic.py <audio_file_path>", file=sys.stderr)
        sys.exit(5)
    
    audio_file_path = sys.argv[1]
    transcribe_from_audio_file(audio_file_path)