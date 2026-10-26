import styled from 'styled-components';

export const DesktopPageWrap = styled.div`
  height: 100%;
  width: 100%;
  overflow: auto;
  background: var(--rb-neutral-bg-0, #f4f4f5);
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 16px;

  .layout-container {
    /* max-width: 1440px; */
    /* min-width: 1120px; */
    /* margin-left: auto; */
    /* margin-right: auto; */
    background-color: transparent;
  }

  /* the tabs + table live on one raised card */
  .crb-tabs-card {
    background: var(--crb-card-solid);
    border-radius: 24px;
    box-shadow: var(--crb-shadow-card);
  }
  .crb-tabs-card > .ant-tabs-nav {
    border-radius: 24px 24px 0 0;
  }

  /* antd */
  .ant-tabs-tab {
    color: var(--r-neutral-foot, #71717a);
    font-size: 15px;
    font-weight: 500;

    padding-top: 18px;
    padding-bottom: 15px;

    &:hover {
      color: var(--r-neutral-title-1, #09090b);
    }
  }
  .ant-tabs > .ant-tabs-nav .ant-tabs-nav-wrap {
    padding-left: 20px;
  }
  .ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn {
    color: var(--r-neutral-title-1, #09090b);
    font-weight: 600;
    font-size: 15px;
    text-shadow: none;
  }
  .ant-tabs-top > .ant-tabs-nav .ant-tabs-ink-bar {
    height: 4px;
    border-radius: 4px 4px 0 0;
    background-color: var(--r-blue-default, #e8552a);
  }
  .ant-tabs-top > .ant-tabs-nav {
    margin-bottom: 0;
    position: sticky;
    z-index: 10;
    background: var(--crb-card-solid);
  }
  .ant-tabs-top > .ant-tabs-nav::before {
    border-bottom: 1px solid var(--crb-hairline);
  }
`;
