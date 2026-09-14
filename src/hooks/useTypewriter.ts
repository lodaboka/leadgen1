import { useState, useEffect, useRef } from 'react';

export function useTypewriter(targetText: string, typingSpeed: number = 30) {
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const indexRef = useRef(0);

  useEffect(() => {
    if (!targetText) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setText("");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsTyping(false);
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setText("");
    indexRef.current = 0;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsTyping(true);
  }, [targetText]);

  useEffect(() => {
    if (!isTyping) return;

    if (indexRef.current < targetText.length) {
      const timeoutId = setTimeout(() => {
        setText(targetText.substring(0, indexRef.current + 1));
        indexRef.current += 1;
      }, typingSpeed);

      return () => clearTimeout(timeoutId);
    } else {
      setIsTyping(false);
    }
  }, [text, isTyping, targetText, typingSpeed]);

  const handleManualChange = (newText: string) => {
    setIsTyping(false); // Stop typing immediately on user interaction
    setText(newText);
  };

  return { text, handleManualChange, isTyping };
}
