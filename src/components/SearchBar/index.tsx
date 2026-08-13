import { Avatar, SearchBar as NutSearchBar, Cell } from '@nutui/nutui-react'
import { routerNavigateTo } from '@/router'
import './index.less'

const SearchBar = () => {
  //+ 点击搜索框跳转到搜索页面
  //+ 注意：NutSearchBar 自身 onClick 在 H5 端可能不触发（内部 input 吞事件），
  //+      因此绑定在外层可点击容器上，并给内部 SearchBar 添加 pointer-events:none
  const handleSearchClick = () => {
    routerNavigateTo('SEARCH')
  }

  return (
    <div className="search-bar">
      <Cell className="search-bar-left" title="途友" onClick={() => {}} />
      {/* 外层可点击容器：保证整个搜索框区域点击都能跳转 */}
      <div className="search-bar-trigger" onClick={handleSearchClick}>
        <NutSearchBar
          className="search-bar-input"
          readOnly
          shape="round"
          placeholder="搜索笔记、攻略、活动"
        />
      </div>
      <Avatar
        size="25"
        src="https://api.dicebear.com/9.x/notionists/svg?seed=user1"
        alt="山林旅人"
        onClick={() => {}}
      />
    </div>
  )
}

export default SearchBar
