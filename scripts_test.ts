import { extractCleanDomain } from "./src/utils/placeUtils";

function getDisplayUrlAsDomain(video: any): string {
  const urlSource = video.placeWebsite || video.placeName || "";
  let domain = extractCleanDomain(urlSource);
  
  if (!domain) return "website.com";

  // If it doesn't have a dot, the user probably just entered "Kempinski Hotels"
  if (!domain.includes(".")) {
    // Convert "kempinski hotels | luxury hotels" -> "kempinskihotels.com"
    domain = domain.split('|')[0].replace(/[^a-z0-9]/g, "") + ".com";
  }

  return domain;
}

console.log(getDisplayUrlAsDomain({ placeName: "Kempinski Hotels | Luxury Hotels" }));
console.log(getDisplayUrlAsDomain({ placeName: "Https://www.tajhotels.com" }));
console.log(getDisplayUrlAsDomain({ placeName: "londontrustedtherapy.com" }));
