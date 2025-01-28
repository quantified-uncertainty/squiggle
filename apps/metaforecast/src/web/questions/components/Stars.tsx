// Database-like functions
export function getstars(numstars: number) {
  let stars = "★★☆☆☆";
  switch (numstars) {
    case 0:
      stars = "☆☆☆☆☆";
      break;
    case 1:
      stars = "★☆☆☆☆";
      break;
    case 2:
      stars = "★★☆☆☆";
      break;
    case 3:
      stars = "★★★☆☆";
      break;
    case 4:
      stars = "★★★★☆";
      break;
    case 5:
      stars = "★★★★★";
      break;
    default:
      stars = "★★☆☆☆";
  }
  return stars;
}

function getStarsColor(numstars: number) {
  let color = "text-yellow-400";
  switch (numstars) {
    case 0:
      color = "text-red-400";
      break;
    case 1:
      color = "text-red-400";
      break;
    case 2:
      color = "text-orange-400";
      break;
    case 3:
      color = "text-yellow-400";
      break;
    case 4:
      color = "text-green-400";
      break;
    case 5:
      color = "text-blue-400";
      break;
    default:
      color = "text-yellow-400";
  }
  return color;
}

export const Stars: React.FC<{ num: number }> = ({ num }) => {
  return <div className={getStarsColor(num) + " text-xs md:text-lg"}>{getstars(num)}</div>;
};
