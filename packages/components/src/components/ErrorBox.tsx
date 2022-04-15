import * as React from "react";
import styled from "styled-components";

const ShowError = styled.div`
  border: 1px solid #792e2e;
  background: #eee2e2;
  padding: 0.4em 0.8em;
`;

export const ErrorBox: React.FC<{
  heading: string;
  children: React.ReactNode;
}> = ({ heading = "Error", children }) => {
  return (
    <ShowError>
      <h3>{heading}</h3>
      {children}
    </ShowError>
  );
};
