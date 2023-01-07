'use strict';

module.exports = {
  getTextPersonsForAdminList(persons) {
    return persons.map((person) => {
      const name = person.name
        ? `<b>${person.name}</b>`
        : `Имя неизвестно, <b>${person.userId}</b>`;
      const phone = person.phone ? person.phone : 'нет';
      const username = person.username ? `@${person.username}` : 'нет';

      return `${name}, кол-во билетов: ${person.ticket}
tel: ${phone} / tg: ${username}`;
    }).join('\n');
  },

  getTextAdminList(eventsWithContacts) {
    return eventsWithContacts.map((event) => `<b>${event.title}</b>
${this.getTextPersonsForAdminList(event.persons)}`).join('\n\n');
  },
};
