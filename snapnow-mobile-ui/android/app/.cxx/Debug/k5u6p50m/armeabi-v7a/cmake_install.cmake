# Install script for directory: E:/1.HK1_2025/ReactNative/deTai/snapnow-social-media-app/snapnow-mobile-ui/node_modules/react-native/ReactAndroid/cmake-utils/default-app-setup

# Set the install prefix
if(NOT DEFINED CMAKE_INSTALL_PREFIX)
  set(CMAKE_INSTALL_PREFIX "C:/Program Files (x86)/appmodules")
endif()
string(REGEX REPLACE "/$" "" CMAKE_INSTALL_PREFIX "${CMAKE_INSTALL_PREFIX}")

# Set the install configuration name.
if(NOT DEFINED CMAKE_INSTALL_CONFIG_NAME)
  if(BUILD_TYPE)
    string(REGEX REPLACE "^[^A-Za-z0-9_]+" ""
           CMAKE_INSTALL_CONFIG_NAME "${BUILD_TYPE}")
  else()
    set(CMAKE_INSTALL_CONFIG_NAME "Debug")
  endif()
  message(STATUS "Install configuration: \"${CMAKE_INSTALL_CONFIG_NAME}\"")
endif()

# Set the component getting installed.
if(NOT CMAKE_INSTALL_COMPONENT)
  if(COMPONENT)
    message(STATUS "Install component: \"${COMPONENT}\"")
    set(CMAKE_INSTALL_COMPONENT "${COMPONENT}")
  else()
    set(CMAKE_INSTALL_COMPONENT)
  endif()
endif()

# Install shared libraries without execute permission?
if(NOT DEFINED CMAKE_INSTALL_SO_NO_EXE)
  set(CMAKE_INSTALL_SO_NO_EXE "0")
endif()

# Is this installation the result of a crosscompile?
if(NOT DEFINED CMAKE_CROSSCOMPILING)
  set(CMAKE_CROSSCOMPILING "TRUE")
endif()

# Set default install directory permissions.
if(NOT DEFINED CMAKE_OBJDUMP)
  set(CMAKE_OBJDUMP "C:/Users/haxua/AppData/Local/Android/Sdk/ndk/27.1.12297006/toolchains/llvm/prebuilt/windows-x86_64/bin/llvm-objdump.exe")
endif()

if(NOT CMAKE_INSTALL_LOCAL_ONLY)
  # Include the install script for each subdirectory.
  include("E:/1.HK1_2025/ReactNative/deTai/snapnow-social-media-app/snapnow-mobile-ui/android/app/.cxx/Debug/k5u6p50m/armeabi-v7a/rnasyncstorage_autolinked_build/cmake_install.cmake")
  include("E:/1.HK1_2025/ReactNative/deTai/snapnow-social-media-app/snapnow-mobile-ui/android/app/.cxx/Debug/k5u6p50m/armeabi-v7a/rngesturehandler_codegen_autolinked_build/cmake_install.cmake")
  include("E:/1.HK1_2025/ReactNative/deTai/snapnow-social-media-app/snapnow-mobile-ui/android/app/.cxx/Debug/k5u6p50m/armeabi-v7a/rnreanimated_autolinked_build/cmake_install.cmake")
  include("E:/1.HK1_2025/ReactNative/deTai/snapnow-social-media-app/snapnow-mobile-ui/android/app/.cxx/Debug/k5u6p50m/armeabi-v7a/safeareacontext_autolinked_build/cmake_install.cmake")
  include("E:/1.HK1_2025/ReactNative/deTai/snapnow-social-media-app/snapnow-mobile-ui/android/app/.cxx/Debug/k5u6p50m/armeabi-v7a/rnscreens_autolinked_build/cmake_install.cmake")
  include("E:/1.HK1_2025/ReactNative/deTai/snapnow-social-media-app/snapnow-mobile-ui/android/app/.cxx/Debug/k5u6p50m/armeabi-v7a/RNVectorIconsSpec_autolinked_build/cmake_install.cmake")
  include("E:/1.HK1_2025/ReactNative/deTai/snapnow-social-media-app/snapnow-mobile-ui/android/app/.cxx/Debug/k5u6p50m/armeabi-v7a/RNCWebViewSpec_autolinked_build/cmake_install.cmake")
  include("E:/1.HK1_2025/ReactNative/deTai/snapnow-social-media-app/snapnow-mobile-ui/android/app/.cxx/Debug/k5u6p50m/armeabi-v7a/rnworklets_autolinked_build/cmake_install.cmake")

endif()

if(CMAKE_INSTALL_COMPONENT)
  set(CMAKE_INSTALL_MANIFEST "install_manifest_${CMAKE_INSTALL_COMPONENT}.txt")
else()
  set(CMAKE_INSTALL_MANIFEST "install_manifest.txt")
endif()

string(REPLACE ";" "\n" CMAKE_INSTALL_MANIFEST_CONTENT
       "${CMAKE_INSTALL_MANIFEST_FILES}")
file(WRITE "E:/1.HK1_2025/ReactNative/deTai/snapnow-social-media-app/snapnow-mobile-ui/android/app/.cxx/Debug/k5u6p50m/armeabi-v7a/${CMAKE_INSTALL_MANIFEST}"
     "${CMAKE_INSTALL_MANIFEST_CONTENT}")
