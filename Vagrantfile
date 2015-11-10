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
	config.vm.network :forwarded_port, guest: 22, host: 2222, id: "ssh", auto_correct: true

	# Share an additional folder to the guest VM. The first argument is
	# the path on the host to the actual folder. The second argument is
	# the path on the guest to mount the folder. And the optional third
	# argument is a set of non-required options.
	config.vm.synced_folder ".", "/mnt/server"

	config.vm.provision "shell", inline: <<-SCRIPT
		apt-get install -y build-essential x11-apps x11-utils blackbox blackbox-themes menu git wireshark expect

		expect <<-EOF
			spawn dpkg-reconfigure wireshark-common  -f readline
			expect "Should non-superusers be able to capture packets?"
			send "y\r"
			expect eof
		EOF

		adduser vagrant wireshark

		sudo -iu vagrant /bin/bash - <<-EOF
			cd ~

			if [ ! -d ~/.nvm ]; then
				git clone https://github.com/creationix/nvm.git ~/.nvm
				cd ~/.nvm
				git checkout $(git describe --abbrev=0 --tags)
				cd ~
			fi

			if ! grep -q '. ~/.nvm/nvm.sh' .profile; then
				echo '. ~/.nvm/nvm.sh' >> .profile
			fi

			. ~/.nvm/nvm.sh

			nvm install node
			nvm alias default node
			echo "rar \\$(nvm version)"

			nvm ls | grep -v iojs | grep -o -P "v\\d+\\.\\d+\\.\\d+" | sort -u | grep -v "\\$(nvm version)" | while read rmver; do
				echo "Uninstall \\$rmver"
				nvm uninstall \\$rmver
			done

		EOF

		cp /mnt/server/dist/xserver.conf /etc/init/

		initctl stop xserver
		kill -HUP 1
		initctl start xserver

		update-menus
		sudo -iu vagrant /bin/bash - <<-EOF
			cp /mnt/server/dist/blackboxrc /home/vagrant/.blackboxrc
			mkdir -p /home/vagrant/.blackbox/styles
			cp /mnt/server/dist/Gray /home/vagrant/.blackbox/styles/
		EOF
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
