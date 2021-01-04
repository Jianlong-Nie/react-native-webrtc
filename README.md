# react-native-webrtc
实现react-native 版本的webrtc，包含服务器端
##基本通讯过程
首先，两个客户端（Alice & Bob）想要创建连接，一般来说需要有一个双方都能访问的服务器来帮助他们交换连接所需要的信息。有了交换数据的中间人之后，他们首先要交换的数据是SessionDescription（SD），这里面描述了连接双方想要建立怎样的连接。
![image.png](https://upload-images.jianshu.io/upload_images/9126595-46ab4a737d127dae.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
##关于SD
一般来说，在建立连接之前连接双方需要先通过API来指定自己要传输什么数据（Audio，Video，DataChannel），以及自己希望接受什么数据，然后Alice调用CreateOffer()方法，获取offer类型的SessionDescription，通过公共服务器传递给Bob，同样地Bob通过调用CreateAnswer()，获取answer类型的SessionDescription，通过公共服务器传递给Alice。 在这个过程中无论是哪一方创建Offer（Answer）都无所谓，但是要保证连接双方创建的SessionDescription类型是相互对应的。Alice=Answer Bob=Offer | Alice=Offer Bob=Answer
关于webrtc相关的资料：
https://developer.mozilla.org/zh-CN/docs/Web/API/RTCPeerConnection
https://zhuanlan.zhihu.com/p/86751078
##RTCPeerConnection 
RTCPeerConnection接口代表一个由本地计算机到远端的WebRTC连接。该接口提供了创建，保持，监控，关闭连接的方法的实现。
`RTCPeerConnection` 的属性 **[`onicecandidate`](https://developer.mozilla.org/zh-CN/docs/Web/API/RTCPeerConnection/onicecandidate)** （是一个事件触发器 [`EventHandler`](https://developer.mozilla.org/zh-CN/docs/Web/API/EventHandler)） 能够让函数在事件`[icecandidate](https://developer.mozilla.org/zh-CN/docs/Web/Reference/Events/icecandidate "/zh-CN/docs/Web/Reference/Events/icecandidate")`发生在实例  [`RTCPeerConnection`](https://developer.mozilla.org/zh-CN/docs/Web/API/RTCPeerConnection) 上时被调用。 **只要本地代理[ICE](https://developer.mozilla.org/zh-CN/docs/Glossary/ICE) 需要通过信令服务器传递信息给其他对等端时就会触发**。 这让本地代理与其他对等体相协商而浏览器本身在使用时无需知道任何详细的有关信令技术的细节，只需要简单地应用这种方法就可使用您选择的任何消息传递技术将ICE候选发送到远程对等方。

##项目运行过程

启动服务器，目前服务器端口号是4000

```
cd backend
npm install
node /src/index.js
```

安装项目依赖

```
npm install
cd ios
pod install
```

然后打开xcode运行项目即可。