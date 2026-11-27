export const loadGoogleMapsScript = (apiKey) => {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps) {
      resolve(window.google.maps);
      return;
    }
    const scriptId = 'google-maps-script';
    let script = document.getElementById(scriptId);
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,routes&loading=async`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    function handleLoad() {
      resolve(window.google.maps);
      script.removeEventListener('load', handleLoad);
      script.removeEventListener('error', handleError);
    }
    function handleError(err) {
      reject(err);
      script.removeEventListener('load', handleLoad);
      script.removeEventListener('error', handleError);
    }

    script.addEventListener('load', handleLoad);
    script.addEventListener('error', handleError);
  });
};
