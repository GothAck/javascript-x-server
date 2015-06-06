# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure(2) do |config|
  # config.vm.box = "ubuntu/ubuntu-15.04-snappy-core-stable"
  config.vm.box = "ubuntu/trusty64"

  config.vm.provider "virtualbox" do |vb|
    vb.memory = 2048
    vb.cpus = 2
  end

  # Create a forwarded port mapping which allows access to a specific port
  # within the machine from a port on the host machine. In the example below,
  # accessing "localhost:8080" will access port 80 on the guest machine.
  config.vm.network "forwarded_port", guest: 3000, host: 3080

  # Share an additional folder to the guest VM. The first argument is
  # the path on the host to the actual folder. The second argument is
  # the path on the guest to mount the folder. And the optional third
  # argument is a set of non-required options.
  config.vm.synced_folder ".", "/mnt/server"

  config.vm.provision "shell", inline: <<-SCRIPT
    apt-get install -y build-essential x11-apps x11-utils blackbox blackbox-themes menu
    cd /root
    echo "Getting latest version"
    FILE=`curl -s http://nodejs.org/dist/latest/ | grep -o 'node-v[0-9]\\+\\.[0-9]\\+\\.[0-9]\\+\\.tar\\.gz' | head -n1`

    if [[ "$FILE" == "" ]]; then
      exit 2
    fi
    DIR=${FILE%.tar.gz}
    VER=${DIR#node-}

    if [ ! -x /usr/local/bin/node ] || [[ "$(node -v)" != "$VER" ]]; then
      echo "Correct node vesrion not installed"
      if [ ! -d $DIR ]; then
        if [ -f /mnt/server/tmp/$FILE ]; then
          tar zxf /mnt/server/dist/$FILE
        else
          sudo -u vagrant wget "http://nodejs.org/dist/latest/$FILE" -O "/mnt/server/dist/$FILE"
          echo "You do not have the latest nodejs src tarball at /mnt/server/dist/$FILE"
        fi
      fi
      cd $DIR
      ./configure
      make -j2
      make install
    fi

    cp /mnt/server/dist/xserver.conf /etc/init/
    kill -HUP 1
    initctl stop xserver
    initctl start xserver

    update-menus
    sudo -u vagrant cp /mnt/server/dist/blackboxrc /home/vagrant/.blackboxrc
    sudo -u vagrant mkdir -p /home/vagrant/.blackbox/styles
    sudo -u vagrant cp /mnt/server/dist/Gray /home/vagrant/.blackbox/styles/
  SCRIPT

  # Define a Vagrant Push strategy for pushing to Atlas. Other push strategies
  # such as FTP and Heroku are also available. See the documentation at
  # https://docs.vagrantup.com/v2/push/atlas.html for more information.
  # config.push.define "atlas" do |push|
  #   push.app = "YOUR_ATLAS_USERNAME/YOUR_APPLICATION_NAME"
  # end

  # Enable provisioning with a shell script. Additional provisioners such as
  # Puppet, Chef, Ansible, Salt, and Docker are also available. Please see the
  # documentation for more information about their specific syntax and use.
  # config.vm.provision "shell", inline: <<-SHELL
  #   sudo apt-get update
  #   sudo apt-get install -y apache2
  # SHELL
end
