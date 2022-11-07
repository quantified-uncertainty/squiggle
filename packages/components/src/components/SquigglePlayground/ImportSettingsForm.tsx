import { Text } from "../ui/Text";
import React, { useState } from "react";
import { HeadedSection } from "../ui/HeadedSection";
import { JsImports } from "../../lib/jsImports";
import { JsonEditor } from "../JsonEditor";
import { ErrorAlert, SuccessAlert } from "../Alert";

export const ImportSettingsForm: React.FC<{
  initialImports: JsImports;
  setImports: (imports: JsImports) => void;
}> = ({ initialImports, setImports }) => {
  const [importString, setImportString] = useState(() =>
    JSON.stringify(initialImports)
  );
  const [importsAreValid, setImportsAreValid] = useState(true);

  const onChange = (value: string) => {
    setImportString(value);
    let imports = {};
    try {
      imports = JSON.parse(value);
      setImportsAreValid(true);
    } catch (e) {
      setImportsAreValid(false);
    }
    setImports(imports);
  };

  return (
    <div className="p-3 max-w-3xl">
      <HeadedSection title="Import Variables from JSON">
        <div className="space-y-6">
          <Text>
            You can import variables from JSON into your Squiggle code.
            Variables are accessed with dollar signs. For example, "timeNow"
            would be accessed as "$timeNow".
          </Text>
          <div className="border border-slate-200 mt-6 mb-2">
            <JsonEditor
              value={importString}
              onChange={onChange}
              oneLine={false}
              showGutter={true}
              height={150}
            />
          </div>
          <div className="p-1 pt-2">
            {importsAreValid ? (
              <SuccessAlert heading="Valid JSON" />
            ) : (
              <ErrorAlert heading="Invalid JSON">
                You must use valid JSON in this editor.
              </ErrorAlert>
            )}
          </div>
        </div>
      </HeadedSection>
    </div>
  );
};
