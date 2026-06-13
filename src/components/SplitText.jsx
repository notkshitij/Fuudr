import React from 'react';

export const SplitText = ({ text }) => (
  <>
    {text.split('').map((char, i) => (
      char === ' ' ? <span key={i}>&nbsp;</span> : (
        <span key={i} className="hl" data-char={char}>
          <span className="hl-inner">{char}</span>
        </span>
      )
    ))}
  </>
);
