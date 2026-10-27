import styled from 'styled-components';

// MAX is a secondary action: a neutral pill, not the brand accent
export const SendMaxButton = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 22px;
  padding: 0 8px;
  margin-left: 6px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  line-height: 1;
  cursor: pointer;
  user-select: none;
  color: var(--r-neutral-title-1);
  background-color: var(--crb-sunken);
  box-shadow: inset 0 0 0 1px var(--crb-hairline);
  border-radius: 999px;
  transition: background-color 0.15s var(--crb-ease);
  &:hover {
    background-color: var(--crb-sunken-hover);
  }
  &:active {
    background-color: var(--crb-press);
  }
`;

export const MaxButton = styled(SendMaxButton)`
  height: 20px;
  padding: 0 7px;
  font-size: 10px;
`;
