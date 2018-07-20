#!/bin/bash

# Thanks to https://trac.ffmpeg.org/wiki/CompilationGuide/Centos
installCompilingTools() {
    echo -e "\n Installing compiling tools."
    yum  -y install autoconf automake bzip2 cmake freetype-devel gcc gcc-c++ git libtool make mercurial pkgconfig zlib-devel x264-devel
    echo -e "\n Installing nasm"
    cd ~/ffmpeg_sources
    curl -O -L http://www.nasm.us/pub/nasm/releasebuilds/2.13.02/nasm-2.13.02.tar.bz2
    tar xjvf nasm-2.13.02.tar.bz2
    cd nasm-2.13.02
    ./autogen.sh
    ./configure --prefix="$HOME/ffmpeg_build" --bindir="$HOME/bin" && make && make install
    echo -e "\n Installing yasm"
    cd ~/ffmpeg_sources
    curl -O -L http://www.tortall.net/projects/yasm/releases/yasm-1.3.0.tar.gz
    tar xzvf yasm-1.3.0.tar.gz
    cd yasm-1.3.0
    ./configure --prefix="$HOME/ffmpeg_build" --bindir="$HOME/bin" && make && make install
    # SET PATH
    export PATH=$HOME/bin:$PATH
}

# Requires ffmpeg to be configured with --enable-gpl --enable-libx264.
Installx264() {
    echo -e "\n Installing x264"
    cd ~/ffmpeg_sources
    git clone --depth 1 http://git.videolan.org/git/x264
    cd x264
    PKG_CONFIG_PATH="$HOME/ffmpeg_build/lib/pkgconfig" ./configure --prefix="$HOME/ffmpeg_build" --bindir="$HOME/bin" --enable-static && make && make install
}

# Requires ffmpeg to be configured with --enable-gpl --enable-libx265.
Installx265() {
    echo -e "\n Installing x265"
    cd ~/ffmpeg_sources
    hg clone https://bitbucket.org/multicoreware/x265
    cd ~/ffmpeg_sources/x265/build/linux
    cmake -G "Unix Makefiles" -DCMAKE_INSTALL_PREFIX="$HOME/ffmpeg_build" -DENABLE_SHARED:bool=off ../../source && make && make install
}

# Requires ffmpeg to be configured with --enable-libfdk_aac (and --enable-nonfree if you also included --enable-gpl).
InstallAAC() {
    cd ~/ffmpeg_sources
    git clone --depth 1 https://github.com/mstorsjo/fdk-aac
    cd fdk-aac
    autoreconf -fiv
    ./configure --prefix="$HOME/ffmpeg_build" --disable-shared && make && make install
}

# Requires ffmpeg to be configured with --enable-libmp3lame.
InstallLAME() {
    cd ~/ffmpeg_sources
    curl -O -L http://downloads.sourceforge.net/project/lame/lame/3.100/lame-3.100.tar.gz
    tar xzvf lame-3.100.tar.gz
    cd lame-3.100
    ./configure --prefix="$HOME/ffmpeg_build" --bindir="$HOME/bin" --disable-shared --enable-nasm && make && make install
}

InstallOPUS() {
    cd ~/ffmpeg_sources
    curl -O -L https://archive.mozilla.org/pub/opus/opus-1.2.1.tar.gz
    tar xzvf opus-1.2.1.tar.gz
    cd opus-1.2.1
    ./configure --prefix="$HOME/ffmpeg_build" --disable-shared && make && make install
}

InstallOGG() {
    cd ~/ffmpeg_sources
    curl -O -L http://downloads.xiph.org/releases/ogg/libogg-1.3.3.tar.gz
    tar xzvf libogg-1.3.3.tar.gz
    cd libogg-1.3.3
    ./configure --prefix="$HOME/ffmpeg_build" --disable-shared && make && make install
}

InstallVorbis() {
    cd ~/ffmpeg_sources
    curl -O -L http://downloads.xiph.org/releases/vorbis/libvorbis-1.3.5.tar.gz
    tar xzvf libvorbis-1.3.5.tar.gz
    cd libvorbis-1.3.5
    ./configure --prefix="$HOME/ffmpeg_build" --with-ogg="$HOME/ffmpeg_build" --disable-shared && make && make install
}

InstallTheora() {
    cd ~/ffmpeg_sources
    curl -O -L https://ftp.osuosl.org/pub/xiph/releases/theora/libtheora-1.1.1.tar.gz
    tar xzvf libtheora-1.1.1.tar.gz
    cd libtheora-1.1.1
    ./configure --prefix="$HOME/ffmpeg_build" --with-ogg="$HOME/ffmpeg_build" --disable-shared && make && make install
}

InstallVPS() {
    cd ~/ffmpeg_sources
    git clone --depth 1 https://chromium.googlesource.com/webm/libvpx.git
    cd libvpx
    ./configure --prefix="$HOME/ffmpeg_build" --disable-examples --disable-unit-tests --enable-vp9-highbitdepth --as=yasm && make && make install
}

CompilingFFMpeg() {
    cd ~/ffmpeg_sources
    curl -O -L https://ffmpeg.org/releases/ffmpeg-snapshot.tar.bz2
    tar xjvf ffmpeg-snapshot.tar.bz2
    cd ffmpeg
    PATH="$HOME/bin:$PATH" PKG_CONFIG_PATH="$HOME/ffmpeg_build/lib/pkgconfig" ./configure \
    --prefix="$HOME/ffmpeg_build" \
    --pkg-config-flags="--static" \
    --extra-cflags="-I$HOME/ffmpeg_build/include" \
    --extra-ldflags="-L$HOME/ffmpeg_build/lib" \
    --extra-libs=-lpthread \
    --extra-libs=-lm \
    --bindir="$HOME/bin" \
    --enable-gpl \
    --enable-libfdk_aac \
    --enable-libfreetype \
    --enable-libmp3lame \
    --enable-libopus \
    --enable-libvorbis \
    --enable-libtheora \
    --enable-libvpx \
    --enable-libx264 \
    --enable-libx265 \
    --enable-nonfree
    make && make install
    hash -r
}

echo -e '===================================================='
echo -e ' Create source folder if is not exists.'
echo -e '===================================================='

if [ ! -d "$HOME/ffmpeg_sources" ]; then
    mkdir $HOME/ffmpeg_sources
fi

echo -e '===================================================='
echo -e ' Create source Completed.'
echo -e '===================================================='

echo -e '===================================================='
echo -e 'Install compiling tools.'
echo -e '===================================================='
installCompilingTools

if [ -r "$HOME/bin/nasm" ] && [ -r "$HOME/bin/yasm" ]
then
    echo -e '===================================================='
    echo -e ' Install encoders(x264, x265 etc).'
    echo -e '===================================================='
    Installx264 && Installx265 && InstallAAC && InstallLAME && InstallOPUS && InstallOGG && InstallVorbis && InstallTheora && InstallVPS
    echo -e '===================================================='
    echo -e ' Install FFMpeg.'
    echo -e '===================================================='
    CompilingFFMpeg
fi

if [ -r "$HOME/bin/ffmpeg" ]
then
    echo -e '===================================================='
    echo -e ' 测试FFMpeg是否安装成功(1. 生产截图, 2. 转码)'
    echo -e '===================================================='
    ffmpeg -i 01\ -\ Dbz\ Movie\ -\ Worlds\ Strongest.rm -y -f image2 -t 0.001 -s 720x576 dbz.jpg
    if [ -e "./dbz.jpg" ]
    then
        echo -e '===================================================='
        echo -e ' FFMpeg 生产截图成功'
        echo -e '===================================================='
        ffmpeg -i 01\ -\ Dbz\ Movie\ -\ Worlds\ Strongest.rm \
        -y -metadata title="Dbz Movie Worlds" \
        -y -metadata comment="Dbz Movie Worlds videos!" \
        -c:v libx264 \
        -preset superfast \
        -x264opts keyint=25 \
        -r 15 \
        -b:v 500k \
        -c:a aac \
        -strict experimental \
        -ar 44100 \
        -ac 2 \
        -b:a 64k \
        -vf "movie=a.png[watermark];scale=1364x768[scale];[scale][watermark] overlay=30:30[out]" \
        -f mp4 "dbz.mp4"
        if [ -e "./dbz.mp4" ]
        then
            echo -e '===================================================='
            echo -e ' FFMpeg 转码mp4成功'
            echo -e '===================================================='
        fi
    fi
fi