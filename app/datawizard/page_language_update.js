// ADD THIS useEffect TO app/datawizard/page.js
// After line 49 (after the addLog function)

// Persist language choice to localStorage for FeedbackButton
useEffect(() => {
  localStorage.setItem('datawizard_language', language);
}, [language]);
