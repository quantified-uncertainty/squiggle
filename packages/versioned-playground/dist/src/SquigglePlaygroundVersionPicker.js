"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button, CodeBracketIcon, Dropdown, DropdownMenu, DropdownMenuActionItem, DropdownMenuLinkItem, DropdownMenuSeparator, WrenchIcon, } from "@quri/ui";
import { checkSquiggleVersion, squiggleVersions, } from "./versions.js";
export const SquigglePlaygroundVersionPicker = ({ version, onChange, size }) => {
    const versionIsValid = checkSquiggleVersion(version);
    const versionTitle = (version) => version === "dev" ? "Dev" : version;
    const versionIcon = (version) => version === "dev" ? WrenchIcon : CodeBracketIcon;
    const CurrentIcon = versionIcon(version);
    return (_jsx("div", { className: "flex", children: _jsx(Dropdown, { render: ({ close }) => (_jsxs(DropdownMenu, { children: [squiggleVersions.map((version) => (_jsx(DropdownMenuActionItem, { title: versionTitle(version), icon: versionIcon(version), onClick: () => {
                            onChange(version);
                            close();
                        } }, version))), _jsx(DropdownMenuSeparator, {}), _jsx(DropdownMenuLinkItem, { href: "https://www.squiggle-language.com/docs/Changelog", newTab: true, title: "Changelog", close: close })] })), children: _jsx(Button, { size: size, children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(CurrentIcon, { size: 14, className: "text-slate-500" }), versionTitle(version), versionIsValid ? "" : ` (unknown)`] }) }) }) }));
};
//# sourceMappingURL=SquigglePlaygroundVersionPicker.js.map