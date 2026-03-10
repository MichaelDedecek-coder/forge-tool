// ADD THIS useEffect TO app/datapalo/page.js
// After line 49 (after the addLog function)

// Persist language choice to localStorage for FeedbackButton
useEffect(() => {
  localStorage.setItem('datapalo_language', language);
}, [language]);
