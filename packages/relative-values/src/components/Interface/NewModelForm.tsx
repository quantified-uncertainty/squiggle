import { modelRoute } from "@/routes";
import { useStorageDispatch } from "@/storage/StorageProvider";
import { FC, useState } from "react";
import { Button } from "../ui/Button";
import { useInterfaceContext, useSelectedInterface } from "./InterfaceProvider";

export const NewModelForm: FC = () => {
  const [id, setId] = useState("");
  const [author, setAuthor] = useState("");
  const [title, setTitle] = useState("");

  const { catalog } = useSelectedInterface();
  const { interfaceId } = useInterfaceContext();
  const dispatch = useStorageDispatch();

  const disabled = !(id && author);

  const save = () => {
    dispatch({
      type: "createModel",
      payload: {
        interfaceId,
        model: {
          id,
          author,
          title,
        },
      },
    });
    window.history.replaceState(undefined, "", modelRoute(catalog.id, id));
  };

  return (
    <div className="flex flex-col items-stretch gap-2 max-w-5xl mx-auto">
      <div>
        <label className="font-bold">ID</label>
        <input
          type="text"
          className="p-1 rounded border border-gray-200 w-full mb-4"
          onChange={(e) => setId(e.currentTarget.value)}
        />
      </div>
      <div>
        <label className="font-bold">Author</label>
        <input
          type="text"
          className="p-1 rounded border border-gray-200 w-full mb-4"
          onChange={(e) => setAuthor(e.currentTarget.value)}
        />
      </div>
      <div>
        <label className="font-bold">Title</label>
        <input
          type="text"
          className="p-1 rounded border border-gray-200 w-full mb-4"
          onChange={(e) => setTitle(e.currentTarget.value)}
        />
      </div>
      <div className="self-end">
        <Button onClick={save} disabled={disabled}>
          Save
        </Button>
      </div>
    </div>
  );
};
