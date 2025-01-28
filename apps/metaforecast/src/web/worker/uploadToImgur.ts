import axios, { AxiosRequestConfig } from "axios";

type AxiosRequestConfigWithAnyHeaders = Omit<AxiosRequestConfig, "headers"> & {
  headers?: any;
  // See: <https://github.com/axios/axios/issues/4193>
};

export async function uploadToImgur(dataURL: string): Promise<string> {
  const request: AxiosRequestConfigWithAnyHeaders = {
    method: "post",
    url: "https://api.imgur.com/3/image",
    headers: {
      Authorization: `Bearer ${process.env.IMGUR_BEARER}`,
    },
    data: {
      type: "base64",
      image: dataURL.split(",")[1],
    },
  };

  let url = "https://i.imgur.com/qcThRRz.gif"; // Error image
  try {
    const response = await axios(request).then((response) => response.data);
    url = `https://i.imgur.com/${response.data.id}.png`;
  } catch (error) {
    console.log("error", error);
  }

  return url;
}
