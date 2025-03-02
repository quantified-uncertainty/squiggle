import { Platform } from "../types";

/*
 * All code related to this was hopelessly outdated. Check out metaforecast repo history for more.
 *
 * Relevant links:
 * https://www.givewell.org/research/internal-forecasts
 * https://blog.givewell.org/2024/11/08/making-predictions-about-our-grants/
 * https://github.com/quantified-uncertainty/metaforecast/blob/master/input/givewellopenphil-urls.txt - old URLs that were used for this platform
 */
export const givewellopenphil: Platform = {
  name: "givewellopenphil",
  label: "GiveWell/OpenPhilanthropy",
  color: "#32407e",

  async fetcher() {
    return null;
  },

  calculateStars() {
    return 2; // Nuño
  },
};
