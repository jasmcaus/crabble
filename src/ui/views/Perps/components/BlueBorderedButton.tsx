import { Button } from 'antd';
import styled from 'styled-components';

export const PerpsBlueBorderedButton = styled(Button)`
  height: 44px;
  font-size: 15px;
  font-style: normal;
  font-weight: 500;
  background-color: transparent;
  color: var(--r-blue-default, #f26b3a);
  border: 1px solid var(--r-blue-default, #f26b3a);

  &:focus {
    background-color: transparent;
    color: var(--r-blue-default, #f26b3a);
    border: 1px solid var(--r-blue-default, #f26b3a);
  }

  &:hover {
    background: var(--r-blue-light1, #fdefe9);
    color: var(--r-blue-default, #f26b3a);
    border: 1px solid var(--r-blue-default, #f26b3a);
  }

  &:hover:before {
    background-color: transparent;
  }

  &::before {
    transition: none;
    background-color: transparent;
  }
  &.ant-btn[disabled],
  &.ant-btn[disabled]:hover,
  &.ant-btn[disabled]:focus,
  &.ant-btn[disabled]:active {
    background-color: transparent;
    color: var(--r-blue-default, #f26b3a);
    border: 1px solid var(--r-blue-default, #f26b3a);
  }
`;
