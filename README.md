# Web application to control Pepper simulation in ROS/Gazebo

This web application runs in a Chrome browser on Android, Windows or Linux on whatever computer or phone you are using to control the Pepper robot. IOS is not supported as it is not compatible with the Web Speech API. This application uses rosbridge to communicate with the Pepper robot simulation in ROS/Gazebo.

If you use an Android phone, vocabulary can be downloaded, only speech recognition can take place locally.

The program is contained in a single web page, currently called index.html, which is loaded from a web server. The web server (usually) runs on the robot. Thus, the program can be loaded whenever the robot is present.

## Usage Follow these instructions to install and execute Pepper Robot Controller.

### Installation: 

- Note the robot's IP address for later use as a url.

- Install Rosbridge:

  - Ubuntu 16.04 LTS

    ```bash
    sudo apt-get install ros-kinetic-rosbridge-suite
    ```
    
   - Ubuntu 18.04 LTS
  
     ```bash
     sudo apt-get install ros-melodic-rosbridge-suite
     ```
  
- Install the apache2 web server. This also installs the ssl-certs package, which sets up the snakeoil certificate and key.

  ```bash
  sudo apt-get install apache2
  ```

  

- Enable the apache2 ssl module

  ```bash
  sudo a2enmod ssl
  ```

- Test the server by addressing it from a browser, for instance http://127.0.0.1/. You should get the apache2 default page.

- (TODO The default page should be replaced by one that has been customized.)

- Clone the simulation control to /var/www/html/ run:
  ```bash
  git clone https://github.com/andersonleite1/pepper-controller.git
  ```

- Install tf2_web_republisher

  - Ubuntu 16.04 LTS

    ```bash
    sudo apt-get install  ros-kinetic-tf2-web-republisher
    ```

  - Ubuntu 18.04 LTS

    ```bash
    sudo apt-get install  ros-melodic-tf2-web-republisher
    ```

### Startup: 
Each time you want to start using Pepper Simulation Control:

- Bring your robot. Run Pepper simulation in ROS/Gazebo

- Launch the rosbridge_server on the robot: (Refer to http://wiki.ros.org/rosbridge_suite/Tutorials/RunningRosbridge)
  
  ```bash
  roslaunch rosbridge_server rosbridge_websocket.launch
  ```

- Launch the tf2_web_republisher
  ```bash
  roslaunch rosbridge_server rosbridge_websocket.launch
  ```

- In the Chrome browser on your laptop or Android phone, load the page http://127.0.0.1/pepper-controller/, using http with the robot url. The first time, the browser may respond with an error message, which essentially asks you to OK, relying on the self-signed certificate.

- On the page http://127.0.0.1/pepper-controller, the url with the port number will appear (usually 9090)

  ```bash
  <robot's url>:9090 
  ```

In the Robot URL box and click the Connect button. The button should now say Disconnect and you should hear "Connected".


### Running

- Click any arrow to move the robot.
- Click the Microphone to use speech. You will be requested to allow the use of the mike. Do it.
- Say, "run", or other commands. Check the Help for valid commands.



# Build

# License

What was developed in this application was based on the repository https://github.com/UbiquityRobotics/speech_commands .

This application was developed in order to try to understand how to communicate with a Pepper Sumulation running in ROS/Gazebo.

Copyright belongs to https://github.com/UbiquityRobotics, I made some code re-adaptations to meet the needs of the web application to communicate specifically with the Pepper simulation running in ROS/Gazebo.

# Authors

contact@ubiquityrobotics.com

Readapted by: andersonleite.bsi@gmail.com
