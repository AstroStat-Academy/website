import React, { useEffect, useRef, useState } from 'react';

interface Props {
  phrases: string[];
  typingSpeed?: number;   // ms per character
  deleteSpeed?: number;   // ms per character
  pauseAfterType?: number;
  pauseAfterDelete?: number;
  className?: string;
}

export default function Typewriter({
  phrases,
  typingSpeed = 72,
  deleteSpeed = 28,
  pauseAfterType = 2200,
  pauseAfterDelete = 380,
  className = '',
}: Props) {
  const [text, setText]         = useState('');
  const [deleting, setDeleting] = useState(false);
  const [idx, setIdx]           = useState(0);
  const [cursorOn, setCursorOn] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  // Blinking block cursor — 530 ms period
  useEffect(() => {
    const id = setInterval(() => setCursorOn(c => !c), 530);
    return () => clearInterval(id);
  }, []);

  // Typewriter logic
  useEffect(() => {
    const phrase = phrases[idx % phrases.length];

    if (!deleting) {
      if (text.length < phrase.length) {
        // Slight random jitter makes it feel like real typing
        const delay = typingSpeed * (0.6 + Math.random() * 0.8);
        timerRef.current = setTimeout(
          () => setText(phrase.slice(0, text.length + 1)),
          delay,
        );
      } else {
        timerRef.current = setTimeout(() => setDeleting(true), pauseAfterType);
      }
    } else {
      if (text.length > 0) {
        timerRef.current = setTimeout(
          () => setText(text.slice(0, -1)),
          deleteSpeed,
        );
      } else {
        timerRef.current = setTimeout(() => {
          setDeleting(false);
          setIdx(i => i + 1);
        }, pauseAfterDelete);
      }
    }

    return () => clearTimeout(timerRef.current);
  }, [text, deleting, idx, phrases, typingSpeed, deleteSpeed, pauseAfterType, pauseAfterDelete]);

  return (
    <span className={className}>
      {text}
      <span aria-hidden="true" style={{ opacity: cursorOn ? 1 : 0 }}>█</span>
    </span>
  );
}
