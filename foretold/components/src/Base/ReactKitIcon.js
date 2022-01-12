/** @jsx React.DOM */
import React from 'react';
import {
  Icon
} from 'react-icons-kit';
import {
  home
} from 'react-icons-kit/typicons/home';
import {
  user
} from 'react-icons-kit/ikons/user';
import {
  arrowLeft2
} from 'react-icons-kit/icomoon/arrowLeft2';
import {
  arrowRight2
} from 'react-icons-kit/icomoon/arrowRight2';
import {
  earth
} from 'react-icons-kit/icomoon/earth';
import {
  columns
} from 'react-icons-kit/ikons/columns';
import {
  ic_people
} from 'react-icons-kit/md/ic_people';
import {
  bulb
} from 'react-icons-kit/entypo/bulb';
import {
  socialBuffer
} from 'react-icons-kit/ionicons/socialBuffer';
import {
  flash
} from 'react-icons-kit/entypo/flash';
import {
  gavel
} from 'react-icons-kit/fa/gavel';
import {
  plus as circlePlus
} from 'react-icons-kit/metrize/plus';
import {
  chevronRight
} from 'react-icons-kit/ionicons/chevronRight';
import {
  chevronLeft
} from 'react-icons-kit/ionicons/chevronLeft';
import {
  lock
} from 'react-icons-kit/entypo/lock';
import {
  chevronDown
} from 'react-icons-kit/fa/chevronDown';
import {
  emailUnread
} from 'react-icons-kit/ionicons/emailUnread';
import {
  u26FA as tent
} from 'react-icons-kit/noto_emoji_regular/u26FA';
import {
  ic_content_copy
} from 'react-icons-kit/md/ic_content_copy';
import {
  magicWand
} from 'react-icons-kit/icomoon/magicWand';
import {
  pacman
} from 'react-icons-kit/icomoon/pacman';
import {
  thList as list
} from 'react-icons-kit/typicons/thList';
import {
  starFull
} from 'react-icons-kit/icomoon/starFull';
import {
  arrowBack
} from 'react-icons-kit/typicons/arrowBack';
import {
  reply
} from 'react-icons-kit/fa/reply';
import {
  close
} from 'react-icons-kit/fa/close';

let types = {
  'HOME': home,
  'LOCK': lock,
  'USER': user,
  'COLUMNS': columns,
  'EARTH': earth,
  'TENT': tent,
  'LAYERS': socialBuffer,
  'PEOPLE': ic_people,
  'FLASH': flash,
  'GAVEL': gavel,
  'BULB': bulb,
  'CIRCLE_PLUS': circlePlus,
  'ARROW_RIGHT': arrowRight2,
  'ARROW_LEFT': arrowLeft2,
  'CHEVRON_LEFT': chevronLeft,
  'CHEVRON_RIGHT': chevronRight,
  'CHEVRON_DOWN': chevronDown,
  'EMAIL_UNREAD': emailUnread,
  'COPY': ic_content_copy,
  'MAGIC_WAND': magicWand,
  'PACMAN': pacman,
  'LIST': list,
  'STAR_FULL': starFull,
  'ARROW_BACK': arrowBack,
  'REPLY': reply,
  'CLOSE': close,
};

export class ReactKitIcon extends React.Component {
  render() {
    const {
      iconType,
      size,
      className
    } = this.props;
    return React.createElement(Icon, {
      size: size,
      icon: types[iconType],
      className: className
    });
  }
}