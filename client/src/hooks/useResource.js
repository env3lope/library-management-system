import { useEffect, useState } from "react";
import { api } from "../services/api";

function useResource(endpoint, refresh = 0) {
  const requestKey = `${endpoint}:${refresh}`;
  const [resource, setResource] = useState({
    key: null,
    data: null,
    error: "",
    loading: true,
  });

  useEffect(() => {
    let active = true;
    api(endpoint)
      .then((result) => {
        if (active) {
          setResource({ key: requestKey, data: result, error: "", loading: false });
        }
      })
      .catch((requestError) => {
        if (active)
          setResource({
            key: requestKey,
            data: null,
            error: requestError.message,
            loading: false,
          });
      });
    return () => {
      active = false;
    };
  }, [endpoint, refresh, requestKey]);

  if (resource.key !== requestKey)
    return { data: null, error: "", loading: true };
  return resource;
}

export default useResource;
